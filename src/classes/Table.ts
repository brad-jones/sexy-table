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
        private container: JQuery;

        /**
         * The instance of the Sizer for this Table.
         */
        private sizer: Sizer;

        /**
         * The instance of the Sorter for this Table.
         */
        private sorter: Sorter;

        /**
         * Give us the tables top level container element.
         * Eg: <div class="sexy-table"></div>
         */
        public constructor(table: Element|JQuery)
        {
            this.container = $(table);

            this.InsertCellWrapper();

            if (this.container.hasClass('sortable'))
            {
                this.MakeSortable();
            }

            this.sizer = new Sizer(this.container);
        }

        /**
         * Programatically make a table sortable.
         */
        public MakeSortable(): void
        {
            this.sorter = new Sorter(this.container);
        }

        /**
         * This must be done before the Sorter is initialised but the Sorter
         * can not run after the SizeCalculator thus we run it here.
         */
        private InsertCellWrapper(): void
        {
            this.container.find('li').wrapInner('<div class="inner"></div>');
        }
    }
}
