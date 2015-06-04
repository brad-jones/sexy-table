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

        protected rows: number = 0;
        protected sort: Object;
        protected search: Object;

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

        protected OnScroll(): void
        {
            if ($(window).scrollTop() + $(window).height() == $(document).height())
            {
                this.rows = this.container.find('.tbody ul').length;
                this.GetNext();
            }
        }

        protected OnSort(column, direction): void
        {
            this.rows = 0;
            this.sort = {'column':column, 'direction':direction};
            this.GetNext();
        }

        protected OnSearch(column, terms): void
        {
            this.rows = 0;
            this.search = {'column':column, 'terms':terms};
            this.GetNext();
        }

        protected GetNext(): void
        {
            this.nextCb(this.rows, this.sort, this.search, this.OnResponse.bind(this));
        }

        protected OnResponse(response: Object): void
        {
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
                try { this.table.GetSorter().UseServer(this.OnSort.bind(this)); }
                catch (e) {}

                try { this.table.GetSearcher().UseServer(this.OnSearch.bind(this)); }
                catch (e) {}

                this.FirstPage = false;
            }
        }
    }
}
