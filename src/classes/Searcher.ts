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
         * The main lunr.js index. Use for global searches.
         *
         * @see http://lunrjs.com/
         */
        protected index: lunr.Index;

        /**
         * The per column lunr.js index. Use for column specific searches.
         *
         * @see https://goo.gl/1Ao45P
         */
        protected perColIndex: lunr.Index;

        /**
         * Instead of using Lunr for searching, we can hookup the Searcher
         * to a server backend. See the "Pager" for more details about working
         * with a server backend.
         */
        protected serverCb: Function;

        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        public constructor(protected table: Table)
        {
            this.container = this.table.GetContainer();

            this.EnsureTableHasThead();

            this.BuildIndexes();
        }

        /**
         * Searchable tables rely on the thead and tbody containers!
         */
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
         * Tells us to redirect all search requests to your callback.
         * Lunr.js is no longer used for searching. See the "Pager" for more
         * details about working with a server backend.
         *
         * > TODO: When the Searcher is told to use a searcher backend
         * > it still requires Lunr.js to be loaded. Need to move the dependancy
         * > check to somewhere later on in the pipeline.
         *
         * > NOTE: I have had ideas about some sort of hybrid client side and
         * > server side searching solution, where the lunr search would be
         * > used as a cache of sorts but I haven't had a chance to develop my
         * > thoughts any further.
         */
        public UseServer(serverCb: Function): void
        {
            this.serverCb = serverCb;
        }

        /**
         * Using Lunr.js we search the Table for the supplied Terms.
         *
         * If the column is set to "all" we search all columns.
         * Otherwise this needs to be the snake case name of the column.
         * ie: first_name or col_1 depending on how the table is serialized.
         *
         * To reset the table supply a null or empty search term.
         */
        public Query(terms: string, column = 'all'): void
        {
            // Reset table if no terms supplied
            if (terms == null || terms == "")
            {
                this.table.Reset(); return;
            }

            // If we have a server callback let's use it instead.
            if (this.serverCb != null)
            {
                this.serverCb(column, terms); return;
            }

            // Lets grab some results from Lunr
            var results = new Array<lunr.IIndexSearchResult>();
            if (column == 'all')
            {
                results = this.index.search(terms);
            }
            else
            {
                results = this.perColIndex.search(column + ":" + terms);
            }

            // Collect the rows that match our results from lunr
            var matches = new Array<Object>();
            var original = this.table.GetReader().GetOriginal();
            for (var result in results)
            {
                for (var row in original)
                {
                    if (results[result].ref == original[row]['_guid'])
                    {
                        matches.push(original[row]);
                    }
                }
            }

            // Maintain any current sort state
            if (this.table.HasSorter())
            {
                matches = this.table.GetSorter().Sort(matches);
            }

            // Redraw the table
            this.table.Redraw(matches, true);
        }

        /**
         * Build 2 indexes of the table.
         *
         *   - We use one for global searches across the entire table.
         *   - We use a second for searches specific to a column.
         *
         * @see https://goo.gl/1Ao45P
         */
        public BuildIndexes(): void
        {
            // Bail out if we have been told to use a server for all searching.
            if (this.serverCb != null) return;

            // Build the schema's for both indexes
            this.index = this.BuildIndexSchema();
            this.perColIndex = this.BuildIndexSchema();

            // Grab the table data
            var data = this.table.GetReader().GetSerialized();

            // Seed both indexes with the table data
            for (var row in data)
            {
                var documentAll = {}, documentCol = {};

                for (var column in data[row])
                {
                    if (column == '_guid')
                    {
                        documentAll[column] = data[row][column];
                        documentCol[column] = data[row][column];
                    }
                    else if(column != '_dom')
                    {
                        documentAll[column] = data[row][column];
                        documentCol[column] = column + ":" + data[row][column];
                    }
                }

                this.index.add(documentAll);
                this.perColIndex.add(documentCol);
            }
        }

        /**
         * Builds the Lunr Index Schema for both indexes.
         */
        protected BuildIndexSchema(): lunr.Index
        {
            var headings = this.table.GetReader().GetHeadings();

            return lunr(function()
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
        }
    }
}
