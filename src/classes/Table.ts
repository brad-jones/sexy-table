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
            return this.reader;
        }

        /**
         * The instance of the Sizer for this Table.
         */
        protected sizer: Sizer;
        public GetSizer(): Sizer
        {
            return this.sizer;
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

        /**
         * Give us the tables top level container element.
         * Eg: <div class="sexy-table"></div>
         */
        public constructor(table: Element|JQuery)
        {
            this.container = $(table);

            // Assign ourself to the table DOM data for easy retrieval
            this.container.data('sexy-table', this);

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
            // of the table cells and this show the table.
            this.sizer = new Sizer(this);

            // Automatically make the table searchable if Lunr has been loaded.
            if (typeof lunr != 'undefined')
            {
                this.MakeSearchable();
            }
        }

        /**
         * This must be done before the Sorter is initialised but the Sorter
         * can not run after the SizeCalculator thus we run it here.
         */
        protected InsertCellWrapper(): void
        {
            this.container.find('li').wrapInner('<div class="inner"></div>');
        }

        /**
         * Programatically make a table sortable.
         */
        public MakeSortable(): void
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
        }

        /**
         * Programatically make a table searchable.
         */
        public MakeSearchable(): void
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
        }

        /**
         * Programatically make a table filterable.
         */
        public MakeFilterable(): void
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

            if (typeof rows[0] == 'undefined')
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

            if (reSerialize) this.reader.Serialize();
        }

        /**
         * Quick shortcut to reset the table back to it's original
         * state before any sorting, searching, filtering, etc...
         */
        public Reset(): void
        {
            this.Redraw(this.reader.GetOriginal(), true);
        }
    }
}
