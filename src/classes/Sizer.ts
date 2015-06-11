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
     * This is what emulates the auto sizing features of a normal HTML <table>.
     */
    export class Sizer
    {
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;

        /**
         * Give us the tables top level container element.
         * And we will make ensure it's rows & cells are sized correctly.
         */
        public constructor(protected table: Table)
        {
            this.container = this.table.GetContainer();

            this.SetWidthOfCells();

            this.SetHeightOfRows();

            this.UnhideContainer();

            // Adjust the height of the rows when the window is resized.
            // The width of the cells are percentages and thus only need
            // to be calulcated the once. Obviously this will only have any
            // effect if the table is inside a fluid container.
            $(window).resize(this.SetHeightOfRows.bind(this));
        }

        /**
         * When a table is updated with new data we will need to make sure it's
         * sized correctly. This is used by the Writer and may be used directly
         * at anytime if required.
         */
        public ForceResize(): void
        {
            this.SetWidthOfCells();
            this.SetHeightOfRows();
        }

        /**
         * Loops through all rows in the table and sets their height.
         */
        protected SetHeightOfRows(): void
        {
            var that = this;

            this.container.find('ul')
                .not(this.container.find('.data-bind-template ul'))
                .css('height', 'auto');

            this.container.find('ul')
                .not(this.container.find('.data-bind-template ul'))
                .each(function(index, row)
                {
                    $(row).css('height', that.CalculateRowHeight(row));
                });
        }

        /**
         * Given a UL row element this will loop through all it's LI cells
         * and calculate the rows maximum height.
         */
        protected CalculateRowHeight(row: Element): number
        {
            var maxHeight = -1;

            $(row).find('li').each(function(index, cell)
            {
                if ($(cell).outerHeight(true) > maxHeight)
                {
                    maxHeight = $(cell).outerHeight(true);
                }
            });

            return maxHeight;
        }

        /**
         * Sets the width of all LI cells in the table.
         */
        protected SetWidthOfCells(): void
        {
            this.container.find('li')
            .not(this.container.find('.data-bind-template li'))
            .css('width', this.CalculateCellWidth());
        }

        /**
         * To determine the width of each cell in the table it's a simple matter
         * of setting it's width to a percentage of the overall table width.
         * The browser will then easily take care of dyanmically adjusting the
         * width of the cells for us.
         */
        protected CalculateCellWidth(): string
        {
            return ((1 / this.GetNumberOfCols()) * 100) + '%';
        }

        /**
         * Gets the number of columns in the table.
         *
         * > NOTE: At the this stage the equivalent of colspans are not
         * > supported. The first UL row in the table is assumed to have
         * > the same number of LI cells as the rest of the table.
         */
        protected GetNumberOfCols(): number
        {
            return this.container.find('ul').first().find('li').length;
        }

        /**
         * After all sizing functions have taken place, it's safe to show the
         * table, knowing it won't look like a dogs breakfast, regurgitated.
         */
        protected UnhideContainer(): void
        {
            this.container.css('visibility', 'visible');
        }
    }
}
