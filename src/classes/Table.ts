////////////////////////////////////////////////////////////////////////////////
//       _________                     ___________     ___     __
//      /   _____/ ____ ___  ______ __ \__    ___/____ \_ |__ |  |   ____
//      \_____  \_/ __ \\  \/  <   |  |  |    |  \__  \ | __ \|  | _/ __ \
//      /        \  ___/ >    < \___  |  |    |   / __ \| \_\ \  |_\  ___/
//     /_______  /\___  >__/\_ \/ ____|  |____|  (____  /___  /____/\___  >
//             \/     \/      \/\/                    \/    \/          \/
// -----------------------------------------------------------------------------
//          Designed and Developed by Brad Jones <brad @="bjc.id.au" />
// -----------------------------------------------------------------------------
////////////////////////////////////////////////////////////////////////////////

module SexyTable
{
    /**
     * Represents a Single SexyTable.
     */
    export class Table
    {
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;
        public GetContainer(): JQuery
        {
            return this.container;
        }

        /**
         * The instance of the Reader for this Table.
         */
        protected reader: Reader;
        public GetReader(): Reader
        {
            if (this.reader == null)
            {
                throw new Error('Table Reader not yet created!');
            }

            return this.reader;
        }
        public HasReader(): boolean
        {
            return (this.reader != null);
        }

        /**
         * The instance of the Writer for this Table.
         */
        protected writer: Writer;
        public GetWriter(): Writer
        {
            if (this.writer == null)
            {
                throw new Error('Table is not Writeable! Use MakeWriteable.');
            }

            return this.writer;
        }
        public HasWriter(): boolean
        {
            return (this.writer != null);
        }

        /**
         * The instance of the Sizer for this Table.
         */
        protected sizer: Sizer;
        public GetSizer(): Sizer
        {
            if (this.sizer == null)
            {
                throw new Error('Table Sizer not yet created!');
            }

            return this.sizer;
        }
        public HasSizer(): boolean
        {
            return (this.sizer != null);
        }

        /**
         * The instance of the Sorter for this Table.
         */
        protected sorter: Sorter;
        public GetSorter(): Sorter
        {
            if (this.sorter == null)
            {
                throw new Error('Table is not Sortable! Use MakeSortable.');
            }

            return this.sorter;
        }
        public HasSorter(): boolean
        {
            return (this.sorter != null);
        }

        /**
         * The instance of the Sorter for this Table.
         */
        protected searcher: Searcher;
        public GetSearcher(): Searcher
        {
            if (this.searcher == null)
            {
                throw new Error('Table is not Searchable! Use MakeSearchable.');
            }

            return this.searcher;
        }
        public HasSearcher(): boolean
        {
            return (this.searcher != null);
        }

        /**
         * The instance of the Sorter for this Table.
         */
        protected filterer: Filterer;
        public GetFilterer(): Filterer
        {
            if (this.filterer == null)
            {
                throw new Error('Table is not Filterable! Use MakeFilterable.');
            }

            return this.filterer;
        }
        public HasFilterer(): boolean
        {
            return (this.filterer != null);
        }

        /**
         * The instance of the Pager for this Table.
         */
        protected pager: Pager;
        public GetPager(): Pager
        {
            if (this.pager == null)
            {
                throw new Error('Table is not Pageable! Use MakePageable.');
            }

            return this.pager;
        }
        public HasPager(): boolean
        {
            return (this.pager != null);
        }

        /**
         * The instance of the Editor for this Table.
         */
        protected editor: Editor;
        public GetEditor(): Editor
        {
            if (this.editor == null)
            {
                throw new Error('Table is not Editable! Use MakeEditable.');
            }

            return this.editor;
        }
        public HasEditor(): boolean
        {
            return (this.editor != null);
        }

        /**
         * Give us the tables top level container element.
         * Eg: <div class="sexy-table"></div>
         */
        public constructor(table: Element|JQuery)
        {
            this.container = $(table);

            // Assign ourself to the table DOM data for easy retrieval
            this.container.data('sexy-table', this);

            // Automatically make the table writeable if Transparency
            // is loaded and it contains a data bind template.
            if (typeof Transparency != 'undefined')
            {
                if (this.container.find('.tbody[data-bind]').length == 1)
                {
                    this.MakeWriteable();

                    // Bail out at this point there is no point continuing
                    // because the table only contains a template and no data.
                    return;
                }
            }

            // It's important this runs early on as pretty much
            // everything else assumes this has been done.
            this.InsertCellWrapper();

            // Create a new table reader, this will serialize the DOM into an
            // Object so we don't have to read the DOM for every operation.
            this.reader = new Reader(this);

            // Automatically make the table sortable if it has the class
            if (this.container.hasClass('sortable'))
            {
                this.MakeSortable();
            }

            // Automatically make the table filterable if it has the class
            if (this.container.hasClass('filterable'))
            {
                this.MakeFilterable();
            }

            // Up until this point the table will be hidden from view by css.
            // The sizer will automatically calculate the width of the height
            // of the table cells and then show the table.
            this.sizer = new Sizer(this);

            // Automatically make the table editable if it has the class
            if (this.container.hasClass('editable'))
            {
                this.MakeEditable();
            }

            // Automatically make the table searchable if Lunr has been loaded.
            if (typeof lunr != 'undefined')
            {
                this.MakeSearchable();
            }
        }

        /**
         * Creates a new Editor for the table.
         */
        public MakeEditable(): Editor
        {
            if (this.editor != null) return;

            if (typeof Mousetrap == 'undefined')
            {
                throw new Error
                (
                    'Editable tables require mousetrap.js '+
                    'see: https://craig.is/killing/mice'
                );
            }

            this.editor = new Editor(this);

            return this.editor;
        }

        /**
         * Creates a new Pager for the table.
         * This allows the table to interact with a server backend.
         */
        public MakePageable(nextCb: Function): Pager
        {
            if (this.pager != null) return;

            // Pageable tables must be writeable
            this.MakeWriteable();

            this.pager = new Pager(this, nextCb);

            return this.pager;
        }

        /**
         * Create a new Writer for the table.
         * This will allow tables to be created at runtime from JSON,
         * instead of existing HTML Markup.
         */
        public MakeWriteable(): Writer
        {
            if (this.writer != null) return;

            if (typeof Transparency == 'undefined')
            {
                throw new Error
                (
                    'Writeable tables require transparency.js '+
                    'see: http://leonidas.github.io/transparency/'
                );
            }

            if (this.container.find('.tbody[data-bind]').length == 0)
            {
                throw new Error
                (
                    'Writeable tables require a tbody container '+
                    'that contains a transparency template.'
                );
            }

            this.writer = new Writer(this);

            return this.writer;
        }

        /**
         * Each LI element represents a cell of the table.
         * However for various styling reasons we need to insert an inner
         * container. Unsemantic markup is one of my pet hates thus we do
         * this using javascript.
         */
        public InsertCellWrapper(): void
        {
            this.container.find('li').each(function(index, cell)
            {
                // Ensure we don't wrap an inner container
                // with another inner container.
                if ($(cell).find('.inner').length == 0)
                {
                    // Don't wrap anything inside the data bind template
                    if ($(cell).parents('.data-bind-template').length == 0)
                    {
                        $(cell).wrapInner('<div class="inner"></div>');
                    }
                }
            });
        }

        /**
         * Programatically make a table sortable.
         */
        public MakeSortable(): Sorter
        {
            if (this.sorter != null) return;

            // If this method is called manually the table may not have the
            // sortable class. We will add it here so that it gets the correct
            // styles applied to it.
            if (!this.container.hasClass('sortable'))
            {
                this.container.addClass('sortable');
            }

            this.sorter = new Sorter(this);

            return this.sorter;
        }

        /**
         * Programatically make a table searchable.
         */
        public MakeSearchable(): Searcher
        {
            if (this.searcher != null) return;

            // If this method is called manually and Lunr has not been loaded
            // we will throw an error telling the dev to include Lunr.js
            if (typeof lunr == 'undefined')
            {
                throw new Error
                (
                    'Searchable tables require Lunr! ' +
                    'Get it from http://lunrjs.com/'
                );
            }

            this.searcher = new Searcher(this);

            return this.searcher;
        }

        /**
         * Programatically make a table filterable.
         */
        public MakeFilterable(): Filterer
        {
            if (this.filterer != null) return;

            // A filterable table must be searchable
            this.MakeSearchable();

            // If this method is called manually the table may not have the
            // filterable class. We will add it here so that it gets the
            // correct styles applied to it.
            if (!this.container.hasClass('filterable'))
            {
                this.container.addClass('filterable');
            }

            this.filterer = new Filterer(this);

            return this.filterer;
        }

        /**
         * Given an array of either serialized rows as created by the Reader.
         * Or an array of DOM Elements, this will empty the contents of the
         * tables tbody container and recreate it with the suppplied table rows.
         */
        public Redraw(rows: Array<any>, reSerialize = false): void
        {
            if (this.container.find('.tbody').length == 0)
            {
                throw new Error
                (
                    'Redrawing requires a .tbody container!'
                );
            }

            if (typeof rows[0] == 'undefined' || typeof rows[0] == 'function')
            {
                this.container.find('.tbody').empty(); return;
            }

            var elements = new Array<Element>();

            if (typeof rows[0]['_dom'] != 'undefined')
            {
                for (var row in rows)
                {
                    elements.push(rows[row]["_dom"]);
                }
            }
            else
            {
                elements = rows;
            }

            this.container.find('.tbody').empty().append(elements);

            this.InsertCellWrapper();

            this.sizer.ForceResize();

            if (reSerialize) this.reader.Serialize();

            if (this.HasEditor()) this.editor.ReAttachEventHandlers();
        }

        /**
         * Quick shortcut to reset the table back to it's original
         * state before any sorting, searching, filtering, etc...
         */
        public Reset(): void
        {
            this.Redraw(this.reader.GetOriginal(), true);
            try { this.GetSorter().ResetSortIcons(); } catch(e) {}
            try { this.GetFilterer().ResetFilters(); } catch(e) {}
        }

        /**
         * When new data has been added to the table,
         * you may call this to rerun the table initialisation.
         */
        public Refresh(): void
        {
            // Essure all table cells contain the inner wrapper
            this.InsertCellWrapper();

            // We have added new data to the table so we need to re-read the
            // table into the reader, updating it's "original" state if need be.
            try { this.GetReader().Serialize(true); }
            catch (e) { this.reader = new Reader(this); }

            // Make the table sortable.
            //
            // NOTE: We do not reset the sort state and icons here as in some
            // cases we will want to append data to the table and maintain the
            // current sort state. ie: When Paging.
            if (this.sorter == null && this.container.hasClass('sortable'))
            {
                this.MakeSortable();
            }

            // Make the table filterable.
            //
            // NOTE: Again we do not reset any of the filters for the same
            // reason as the sorter.
            if (this.filterer == null && this.container.hasClass('filterable'))
            {
                this.MakeFilterable();
            }

            // Force a resize of the table after adding the data
            try { this.GetSizer().ForceResize(); }
            catch (e) { this.sizer = new Sizer(this); }

            // Make the table editable.
            try { this.GetEditor().InsertEditFields(); }
            catch (e)
            {
                if (this.container.hasClass('editable'))
                {
                    this.MakeEditable();
                }
            }

            // Then we will rebuild the Lunr Indexes
            //
            // NOTE: When using the Pager, Lunr Indexes will not get built.
            // No point doing work we don't need to do.
            try { this.GetSearcher().BuildIndexes(); }
            catch (e)
            {
                if (typeof lunr != 'undefined')
                {
                    this.MakeSearchable();
                }
            }
        }

        /**
         * Grabs all rows from the table.
         */
        public GetRows(): JQuery
        {
            return this.container.find('ul').not
            (
                this.container.find('.data-bind-template ul')
            );
        }

        /**
         * Grabs all cells in the table.
         */
        public GetCells(): JQuery
        {
            return this.container.find('li').not
            (
                this.container.find('.data-bind-template li')
            );
        }

        /**
         * Creates a multi-dimensional array with all cells
         * from the table grouped by column.
         */
        public GetColumns(): Array<Array<Element>>
        {
            var columns = [];

            this.GetRows().each(function(rowNo, row)
            {
                $(row).find('li').each(function(colNo, cell)
                {
                    if (typeof columns[colNo] == 'undefined') columns.push([]);
                    columns[colNo].push(cell);
                });
            });

            return columns;
        }
    }
}
