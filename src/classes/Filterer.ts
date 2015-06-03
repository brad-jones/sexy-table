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
     * Adds filter controls for each column of the table.
     */
    export class Filterer
    {
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;

        /**
         * Give us the tables top level container element.
         * And we will add some sort controls to the tables first row.
         */
        public constructor(protected table: Table)
        {
            this.container = this.table.GetContainer();

            this.EnsureTableHasThead();

            this.InsertFilterInputs();
        }

        /**
         * Filterable tables rely on the thead and tbody containers!
         */
        protected EnsureTableHasThead(): void
        {
            if (this.container.find('.thead, .tbody').length != 2)
            {
                throw new Error
                (
                    'Sortable tables MUST use .thead and .tbody containers!'
                );
            }
        }

        /**
         * This will add a second row to the thead container.
         * The row will house a text box per column.
         */
        protected InsertFilterInputs(): void
        {
            var headings = this.table.GetReader().GetHeadings();

            var filters = $('<ul></ul>');

            for (var i = 0; i < headings.length; i++)
            {
                var cell = $('<li><div class="inner"></div></li>');

                if (headings[i] != "")
                {
                    var filter = $('<input name="'+headings[i]+'" type="text" placeholder="All" />');
                    filter.keyup(this.OnFilter.bind(this, filter));
                    cell.find('.inner').append(filter);
                }

                filters.append(cell);
            }

            this.container.find('.thead').append(filters);
        }

        /**
         * Callback for each filters keyup event.
         */
        protected OnFilter(filter: Element): void
        {
            // For now multi column filtering is not supported.
            this.container.find('.thead input').not(filter).val('');

            this.table.GetSearcher().Query
            (
                $(filter).val(),
                $(filter).attr('name')
            );
        }
    }
}
