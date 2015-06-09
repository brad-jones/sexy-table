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
     * Ties a SexyTable to a Server Backend.
     */
    export class Pager
    {
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;

        /**
         * If the pager loads the first page this will get set to true.
         * So that we can do table initialisation stuff.
         */
        protected FirstPage = false;

        /**
         * A row counter used so the server knows the number of records to skip.
         */
        protected rows: number = 0;

        /**
         * An object the represents the current sort state.
         */
        protected sort: Object; //{column: string, direction: string};

        /**
         * A flag to donote when we have reached the end of a result set.
         */
        protected atEnd = false;

        /**
         * An object that represents the current search state.
         */
        protected search: Object; //{column: string, terms: string};

        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        public constructor(protected table: Table, protected nextCb: Function)
        {
            this.container = this.table.GetContainer();

            // Lets check to see if the table has any data at all.
            // Sometimes we may include some seed data for the table with the
            // intial page request, other times we may prefer the pager to load
            // the first data set.
            if (this.container.find('.tbody').is(':empty'))
            {
                this.FirstPage = true;
                this.GetNext();
            }

            $(window).scroll(this.OnScroll.bind(this));
        }

        /**
         * Our tables are sexy, we do not use old fashioned clunky next and
         * back buttons. We attach ourselves to the windows on scroll event.
         * Once we detect the user has reachedf the end of the page we will
         * attempt to load more rows into the table.
         *
         * > NOTE: Fancy animations and other loading effects are not provided.
         * > It is up to you to do this in the Pagers nextCb.
         *
         * > TODO: Cater for situations where the table is inside a scrollable
         * > div, instead of the entire window.
         */
        protected OnScroll(): void
        {
            // Bail out if there are no more results to load.
            if (this.atEnd) return;

            var docHeight = $(document).height();
            var windowHeight = $(window).height();
            var scrollTop = $(window).scrollTop();

            if (scrollTop + windowHeight == docHeight)
            {
                this.rows = this.container.find('.tbody ul').length;
                this.GetNext();
            }
        }

        /**
         * If the table is sortable this will fire when a new sort is performed.
         */
        protected OnSort(column, direction): void
        {
            this.rows = 0;
            this.atEnd = false;
            this.sort = {'column':column, 'direction':direction};
            this.GetNext();
        }

        /**
         * If the table is searchable / filterable this will fire
         * when a new search is performed.
         */
        protected OnSearch(column, terms): void
        {
            this.rows = 0;
            this.atEnd = false;
            this.search = {'column':column, 'terms':terms};
            this.GetNext();
        }

        /**
         * Sets up and calls the Next Callback.
         */
        protected GetNext(): void
        {
            this.nextCb
            (
                this.rows,
                this.sort,
                this.search,
                this.OnResponse.bind(this)
            );
        }

        /**
         * Runs when the nextCb calls us, normally after the success of an
         * AJAX request. The response Object is expected to match up with
         * the transparency data bind template.
         */
        protected OnResponse(response: Object): void
        {
            if (response == null)
            {
                // We have no more records to load
                this.atEnd = true; return;
            }

            if (this.rows == 0)
            {
                this.table.GetWriter().Replace(response);
            }
            else
            {
                this.table.GetWriter().Append(response);
            }

            if (this.FirstPage)
            {
                try
                {
                    this.table.GetSorter().UseServer
                    (
                        this.OnSort.bind(this)
                    );
                }
                catch (e) {}

                try
                {
                    this.table.GetSearcher().UseServer
                    (
                        this.OnSearch.bind(this)
                    );
                }
                catch (e) {}

                this.FirstPage = false;
            }
        }
    }
}
