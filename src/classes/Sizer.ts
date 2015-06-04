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

            // Adjust the table sizing as the window changes size.
            // Obviously this would only have any effect if the table
            // is inside a fluid container.
            $(window).resize(this.SetWidthOfCells.bind(this));
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
         * To determine the width of each cell in the table it's simple
         * division. Total Width of Table / Number of Columns.
         * We also need to accound for cell padding / margin.
         */
        protected CalculateCellWidth(): number
        {
            var cols = this.GetNumberOfCols();
            var width = this.GetTotalWidthOfTable();
            var padding = this.GetCellPadding();
            return (width / cols) - padding;
        }

        /**
         * Gets the total width of the table.
         *
         * > NOTE: The standard jQuery width() / innerWidth() / outerWidth()
         * > functions apply a rounding to the result, this does not work.
         * > We need precision so that the cells fit exactly into their rows.
         *
         * @see http://stackoverflow.com/questions/11907514
         */
        protected GetTotalWidthOfTable(): number
        {
            var rect = this.container[0].getBoundingClientRect();

            var width;
            if (rect.width)
            {
                // `width` is available for IE9+
                width = rect.width;
            }
            else
            {
                // Calculate width for IE8 and below
                width = rect.right - rect.left;
            }

            return width;
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
         * Gets the amount of Horizontal Cell Padding.
         *
         * > NOTE: We make an assumption that all cells in the table will use
         * > the same padding. So if your CSS styles are doing something odd
         * > with cell padding this will fail.
         */
        protected GetCellPadding(): number
        {
            var firstCell = this.container.find('li').first();

            return firstCell.outerWidth(true) - firstCell.width();
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
