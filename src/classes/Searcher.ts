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
    export class Searcher
    {
        /**
         * A shortcut to the tables container.
         */
        protected container: JQuery;

        /**
         * The lunr.js index.
         *
         * @see http://lunrjs.com/
         */
        protected index: lunr.Index;

        protected originalTable: Array<Object>;

        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        public constructor(protected table: Table)
        {
            this.container = this.table.GetContainer();

            this.EnsureTableHasThead();

            this.originalTable = this.table.GetReader().GetSerialized().slice(0);

            this.BuildIndex();
        }

        protected EnsureTableHasThead(): void
        {
            if (this.container.find('.thead, .tbody').length != 2)
            {
                throw new Error
                (
                    'Searchable tables MUST use .thead and .tbody containers!'
                );
            }
        }

        /**
         * @see https://goo.gl/1Ao45P
         */
        protected BuildIndex(): void
        {
            var data = this.table.GetReader().GetSerialized();

            var headings = this.table.GetReader().GetHeadings();

            this.index = lunr(function()
            {
                this.ref('_guid');

                for (var i = 0; i < headings.length; i++)
                {
                    if (headings[i] != '_guid' && headings[i] != '_dom')
                    {
                        this.field(headings[i]);
                    }
                }
            });

            for (var row in data)
            {
                var document = {};

                for (var column in data[row])
                {
                    if (column == '_guid')
                    {
                        document[column] = data[row][column];
                    }
                    else if(column != '_dom')
                    {
                        document[column] = column + ":" + data[row][column];
                    }
                }

                this.index.add(document);
            }
        }

        /**
         * Using Lunr.js we search the Table for the supplied Terms.
         *
         * If the column is set to "all" we search all columns.
         * Otherwise this needs to be the snake case name of the column.
         * ie: first_name or col_1 depending on how the table is serialised.
         *
         * To reset the table supply a null or empty search term.
         */
        public Query(terms: string, column = 'all'): void
        {
            // Reset table if no terms suplied
            if (terms == null || terms == "")
            {
                this.ResetTable(); return;
            }

            // Create a new array of results
            var results = new Array<lunr.IIndexSearchResult>();

            if (column == 'all')
            {
                // Perform a search for each column
                var headings = this.table.GetReader().GetHeadings();
                for (var i = 0; i < headings.length; i++)
                {
                    if (headings[i] != '_guid' && headings[i] != '_dom')
                    {
                        results = $.merge
                        (
                            results,
                            this.index.search(headings[i] + ":" + terms)
                        );
                    }
                }

                // Sort the results
                results.sort(function(a, b)
                {
                    return b['score'] - a['score'];
                });

                // Remove duplicates
                // TODO: I'm sure there must be a better way to do this...
                var resultsNew = new Array<lunr.IIndexSearchResult>();
                for (var key in results)
                {
                    var found = false;

                    for (var key2 in resultsNew)
                    {
                        if (results[key].ref === resultsNew[key2].ref)
                        {
                            found = true; break;
                        }
                    }

                    if (!found) resultsNew.push(results[key]);
                }
                results = resultsNew;
            }
            else
            {
                // Just do one search for the specfied column
                results = this.index.search(column + ":" + terms);
            }

            // Redraw the table
            var rows = new Array<Element>();

            for (var result in results)
            {
                for (var row in this.originalTable)
                {
                    if (results[result].ref == this.originalTable[row]['_guid'])
                    {
                        rows.push(this.originalTable[row]["_dom"]);
                    }
                }
            }

            this.container.find('.tbody').empty().append(rows);

            // To make the sorter work on this new dataset
            // we need to restort to this hack. I'm not 100%
            // happy with this but it does the job for now.
            this.table.GetReader().Serialize();

            // Reset the sorter icons
            var icons = this.container.find('.thead i');
            icons.removeClass('fa-sort-asc');
            icons.removeClass('fa-sort-desc');
            icons.addClass('fa-sort');
        }

        public ResetTable(): void
        {
            var rows = new Array<Element>();

            for (var key in this.originalTable)
            {
                rows.push(this.originalTable[key]["_dom"]);
            }

            this.container.find('.tbody').empty().append(rows);

            this.table.GetReader().Serialize();
            
            var icons = this.container.find('.thead i');
            icons.removeClass('fa-sort-asc');
            icons.removeClass('fa-sort-desc');
            icons.addClass('fa-sort');
        }
    }
}
