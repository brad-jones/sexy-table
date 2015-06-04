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
    export class Writer
    {
        /**
         * A shortcut to the tables container.
         */
        protected container: JQuery;

        /**
         * These will be passed on to transparency.js
         *
         * You may set these globally here or you pass in custom
         * directives to either Append or Replace methods.
         *
         * @see https://github.com/leonidas/transparency#directives
         */
        protected directives: Object;
        public GetDirectives(): Object
        {
            return this.directives;
        }
        public SetDirectives(value: Object): void
        {
            this.directives = value;
        }

        /**
         * Ties us to an instance of a Table.
         * Sets up the container shortcut.
         */
        public constructor(protected table: Table)
        {
            this.container = this.table.GetContainer();

            this.CreateDataBindTemplate();
        }

        /**
         * Appends data to the table, then re-initialises the table.
         */
        public Append(viewmodel: Object, directives?: Object): void
        {
            // Before we do anything lets, reset the table to it's
            // original state to ensure sorting works as expected.
            if (!this.container.find('.tbody').is(':empty'))
            {
                this.table.Reset();
            }

            // Grab the template
            var template = this.container.find('.data-bind-template');

            // Render the viewmodel into the template
            template.render
            (
                viewmodel,
                directives == null ? this.directives : directives
            );

            // Clone the results
            var newData = template.children('div').children().clone();

            // Remove any ids created in the template,
            // this will ensure we don't get conflicts.
            template.find('*[id]').removeAttr('id');

            // Append the new data to the existing tbody
            this.container.find('.tbody').append(newData);

            // Remove any data-bind attributes to ensure
            // we do not get any future confusion.
            this.container.find('.tbody *[data-bind]').removeAttr('data-bind');

            // Re-initialises the table.
            this.table.Refresh();
        }

        /**
         * Replaces the current data in the table with this new data.
         */
        public Replace(viewmodel: Object, directives?: Object): void
        {
            this.container.find('.tbody').empty();

            this.Append(viewmodel, directives);
        }

        /**
         * Moves the Data Bind Template.
         *
         * If we leave the template as it is as part of the tbody container.
         * We can't render new rows into the table, as whatever data we pass to
         * the View Framework will override what already exists.
         *
         * > NOTE: This is the case with transparency.js ast least I can't
         * > comment for others but I am making an assumption they will be
         * > similar.
         *
         * Therefore we move the template and hide it too.
         * Then we can render new results into the template and append them
         * into tbody. We can do this as many times as we like.
         */
        protected CreateDataBindTemplate(): void
        {
            var template = $('<div></div>');

            template = template.addClass('data-bind-template').hide();

            template.append
            (
                this.container.find('.tbody').clone().removeAttr('class')
            );

            this.container.append(template);

            this.container.find('.tbody').empty().removeAttr('data-bind');
        }
    }
}
