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
         * The per column lunr.js indexes. Used for column specific searches.
         *
         * > NOTE: We were using this solution: https://goo.gl/1Ao45P
         * > I found this unsatisfactory and have now setup an independent lunr
         * > index for each column of the table.
         */
        protected perColIndexes:
        {
            [index: string]: lunr.Index
        };

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
                results = this.perColIndexes[column].search(terms);
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

            // The results returned from Lunr will be sorted by their relevance
            // scores however if the table is sortable & "SORTED" we will
            // maintain the current sort state.
            if (this.table.HasSorter())
            {
                this.table.GetSorter().Sort(matches);
            }

            // Redraw the table
            this.table.Redraw(matches, true, true);
        }

        /**
         * Build the indexes of the table.
         *
         *   - We use one for global searches across the entire table.
         *   - We then create an index for each column of the table.
         *
         * > NOTE: We were using this solution: https://goo.gl/1Ao45P
         * > I found this unsatisfactory and have now setup an independent lunr
         * > index for each column of the table.
         */
        public BuildIndexes(): void
        {
            // Bail out if we have been told to use a server for all searching.
            if (this.serverCb != null) return;

            // Grab the table data
            var data = this.table.GetReader().GetOriginal();

            // Build the global index
            this.index = this.BuildIndexSchema();
            for (var row in data)
            {
                var document = {};

                for (var column in data[row])
                {
                    if (column == '_guid')
                    {
                        document['_guid'] = data[row]['_guid'];
                    }
                    else if(column != '_dom')
                    {
                        document[column + 'Exact'] = data[row][column];
                        document[column] = this.PrepareIndexValue
                        (
                            data[row][column]
                        );
                    }
                }

                this.index.add(document);
            }

            // Now build an index for each column of the table
            this.perColIndexes = {};
            for (var row in data)
            {
                for (var column in data[row])
                {
                    if (column != '_guid' && column != '_dom')
                    {
                        if (!this.perColIndexes.hasOwnProperty(column))
                        {
                            this.perColIndexes[column] = lunr(function()
                            {
                                this.ref('_guid');
                                this.field('colValueExact', {boost: 10});
                                this.field('colValue');
                            });
                        }

                        this.perColIndexes[column].add
                        ({
                            '_guid': data[row]['_guid'],
                            'colValueExact': data[row][column],
                            'colValue': this.PrepareIndexValue
                            (
                                data[row][column]
                            )
                        });
                    }
                }
            }
        }

        /**
         * Builds the Lunr Index Schema for the global index.
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
                        this.field(headings[i] + 'Exact', {boost: 10});
                        this.field(headings[i]);
                    }
                }
            });
        }

        /**
         * Given a cell value, we prepare it to be inserted into the lunr index.
         *
         * Lunr does a pretty damn good job of indexing paragraphs of text.
         * Where it fails is indexing single items such as a timestamp.
         * Lunr sees the timestamp as a single word and as such you can not
         * search on the diffrent parts (day, month, year) of the date.
         *
         * By removing all special characters, used for formatting and replacing
         * them with spaces, lunr now tokenizes the timestamp, allowing the user
         * to seach by year for example.
         *
         * This same principal applies to things like hyphenated words, a user
         * may not always type the hypens in their search query because they are
         * lazy.
         *
         * However we still need to cater for the case that an exact search term
         * is given thus we index both the unmodified cell value as well as this
         * prepared version.
         *
         * The Exact field get a boost value applied.
         */
        protected PrepareIndexValue(value: string): string
        {
            return value.trim().replace(/[^\w\s]/gi, ' ');
        }
    }
}
