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
     * If set to true we will search for all sexy tables at dom ready and run
     * the automatic width calculations. And then we will show the table.
     */
    export var AutoMakeSexy: boolean = true;

    /**
     * Finds All Sexy Tables in the DOM and Initialises Them.
     */
    $(document).ready(function()
    {
        if (AutoMakeSexy)
        {
            $('.sexy-table').each(function(index, table)
            {
                new Table(table);
            });
        }
    });

    /**
     * IE8 Bind Polyfill
     *
     * > TODO: This doesn't really belong here.
     * > Fork lt-ie-9 and add some ES5 shims.
     *
     * @see https://goo.gl/5J4TJq
     */
    if (!Function.prototype.bind)
    {
        Function.prototype.bind = function(oThis)
        {
            if (typeof this !== 'function')
            {
                throw new TypeError
                (
                    'Function.prototype.bind - ' +
                    'what is trying to be bound is not callable'
                );
            }

            var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP    = function() {},
            fBound  = function()
            {
                return fToBind.apply
                (
                    this instanceof fNOP && oThis ? this : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments))
                );
            };

            fNOP.prototype = this.prototype;
            fBound.prototype = new fNOP();

            return fBound;
        };
    }
}
