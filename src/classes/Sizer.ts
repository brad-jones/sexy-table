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
         * The default would be <div class="sexy-table"></div>
         */
        private container: JQuery;

        /**
         * Give us the tables top level container element.
         * And we will make ensure it's rows & cells are sized correctly.
         */
        public constructor(table: JQuery)
        {
            this.container = table;

            this.SetWidthOfCells();

            this.SetHeightOfRows();

            this.UnhideContainer();

            // Adjust the table sizing as the window changes size.
            // Obviously this would only have any effect if the table
            // is inside a fluid container.
            $(window).resize(this.SetWidthOfCells.bind(this));
            $(window).resize(this.SetHeightOfRows.bind(this));
        }

        private SetHeightOfRows(): void
        {
            var that = this;

            this.container.find('ul').css('height', 'auto');

            this.container.find('ul').each(function(index, row)
            {
                $(row).css('height', that.CalculateRowHeight(row));
            });
        }

        private CalculateRowHeight(row: Element): number
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

        private SetWidthOfCells(): void
        {
            this.container.find('li').css('width', this.CalculateCellWidth());
        }

        private CalculateCellWidth(): number
        {
            var cols = this.GetNumberOfCols();
            var width = this.GetTotalWidthOfTable();
            var padding = this.GetCellPadding();
            return (width / cols) - padding;
        }

        private UnhideContainer(): void
        {
            this.container.css('visibility', 'visible');
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
        private GetTotalWidthOfTable(): number
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

        private GetNumberOfCols(): number
        {
            return this.container.find('ul').first().find('li').length;
        }

        private GetCellPadding(): number
        {
            var firstCell = this.container.find('li').first();

            return firstCell.outerWidth(true) - firstCell.width();
        }
    }
}
