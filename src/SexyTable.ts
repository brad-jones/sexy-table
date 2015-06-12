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
}
