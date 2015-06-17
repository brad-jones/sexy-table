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
    export class Editor
    {
        /**
         * The main container for the entire table.
         */
        protected container: JQuery;

        /**
         * Registers the editor events.
         */
        public constructor(protected table: Table)
        {
            this.container = this.table.GetContainer();

            // Attach the double click event to the entire table.
            // But filtered to each cell of the table, this way when new
            // cells are added to the table we don't have to add new event
            // handlers.
            $(this.container).on
            (
                'dblclick',
                '.inner',
                this.OnCellDbClick.bind(this)
            );
        }

        /**
         * This will run when any cell is double clicked.
         */
        protected OnCellDbClick(event: JQueryEventObject): void
        {
            // Scope hack
            var that = this;

            // Grab the cell
            var cell = $(event.currentTarget);

            // If the cell is inside the thead we should bail out.
            // Editing column headings seems like a dangerous thing.
            if (cell.parents('.thead').length > 0) return;

            // Grab the contents of the cell
            var data = cell.text();

            // Create a new input field to allow the user to edit the data
            var input = $('<input />');
            input.attr('type', 'text');
            input.val(data);

            // Create the save callback
            var save = that.OnSave.bind(that, cell);

            // Bind some keyboard shortcuts to the input box
            Mousetrap(input[0]).bind(['enter', 'mod+s'], save);

            // Also if the input loses focus call the save handler
            input.focusout(save);

            // Replace the contents of the cell with our new input field
            cell.empty().append(input);

            // Focus the input, ready for editing
            input.focus();
        }

        /**
         * This will grab the contents of the input field
         * and place it back directly inside the cell.
         *
         * > NOTE: This does not send any data back to the server!
         * > You must do this yourself with the Reader.
         */
        protected OnSave(cell: JQuery): void
        {
            // Grab the new edited data
            var data = cell.find('input').val();

            // Remove the input field and add the data back into the cell
            cell.empty().text(data);

            // Refresh the table
            if (this.table.HasSearcher())
            {
                // If the table has a searcher, this includes filterable tables.
                // We need to update the search index in a smart way. We can
                // not simply call the Refresh method as it may re-serialize
                // the table in a "searched" or "filtered" state which would
                // remove rows from the table.

                this.table.GetSizer().ForceResize();
                this.table.GetReader().UpdateOriginal(cell);
                this.table.GetSearcher().BuildIndexes();
            }
            else
            {
                this.table.Refresh();
            }
        }
    }
}
