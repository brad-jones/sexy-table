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
     * Allows the cells of the table to be edited.
     *
     * > NOTE: This is not meant to provide anything like the functionality of
     * > an Excel spreadsheet or similar, if that is what you are looking for
     * > see projects like:
     * >
     * >    - http://handsontable.com/
     * >    - http://wijmo.com/products/spreadjs/
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
            this.container.on
            (
                'dblclick',
                '.inner',
                this.OnCellDbClick.bind(this)
            );

            // Because it's not obvious straight away that a cell can be edited.
            // We will prompt the user when the mouse hovers over a cell.

            this.container.on
            (
                'mouseenter',
                '.inner',
                this.ShowEditPrompt.bind(this)
            );

            this.container.on
            (
                'mouseleave',
                '.inner',
                this.HideEditPrompt.bind(this)
            );
        }

        /**
         * Not all cells in the table should be editable.
         * Given a cell this will tell us if we are allowed to edit it or not.
         */
        protected IsCellEditable(cell: JQuery): boolean
        {
            // Editing column headings seems like a dangerous thing.
            if (cell.parents('.thead').length > 0) return false;

            // Can't edit cells that have explicitly been set not be editable
            if (cell.parents('li').data('no-edit') === true) return false;

            return true;
        }

        /**
         * Shows a prompt to the user to double click on the cell to edit it.
         */
        protected ShowEditPrompt(event: JQueryEventObject): void
        {
            // Grab the cell
            var cell = $(event.currentTarget);

            // Bail out if we can't edit this cell
            if (!this.IsCellEditable(cell)) return;

            // Add the edit prompt
            var prompt = $('<p />');
            prompt.addClass('edit-prompt');
            prompt.append($('<i class="fa fa-pencil-square-o"></i>'));
            prompt.append(' Double Click to Edit Me!');
            cell.append(prompt);

            // We are using CSS3 to animate opacity and thus need add the
            // class in a new thread otherwise the animation does not run.
            setTimeout(function(){ prompt.addClass('show'); }, 0);
        }

        /**
         * Removes the edit prompt when the mouse leaves the cell.
         *
         * > NOTE: We can't animate the remove (or more to the point I can't be
         * > bothered right now) because when the double click event happens
         * > it will also call this method to ensure the edit prompt is removed
         * > before grabing the cells text content.
         */
        protected HideEditPrompt(event: JQueryEventObject): void
        {
            $(event.currentTarget).find('.edit-prompt').remove();
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

            // Bail out if we can't edit this cell
            if (!this.IsCellEditable(cell)) return;

            // Make sure the edit prompt it removed
            cell.trigger('mouseleave');

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
