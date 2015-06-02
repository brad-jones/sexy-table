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
            return this.sorter;
        }

        /**
         * The instance of the Sorter for this Table.
         */
        protected searcher: Searcher;
        public GetSearcher(): Searcher
        {
            return this.searcher;
        }

        /**
         * Give us the tables top level container element.
         * Eg: <div class="sexy-table"></div>
         */
        public constructor(table: Element|JQuery)
        {
            this.container = $(table);

            this.container.data('sexy-table', this);

            this.InsertCellWrapper();
            
            this.reader = new Reader(this);

            if (this.container.hasClass('sortable'))
            {
                this.MakeSortable();
            }

            this.sizer = new Sizer(this);

            if (typeof lunr != 'undefined')
            {
                this.searcher = new Searcher(this);
            }
        }

        /**
         * Programatically make a table sortable.
         */
        public MakeSortable(): void
        {
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
         * This must be done before the Sorter is initialised but the Sorter
         * can not run after the SizeCalculator thus we run it here.
         */
        protected InsertCellWrapper(): void
        {
            this.container.find('li').wrapInner('<div class="inner"></div>');
        }
    }
}
