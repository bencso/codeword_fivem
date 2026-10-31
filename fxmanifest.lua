fx_version 'cerulean'
game 'gta5'

author 'bencso'
description 'Codenames'

shared_script 'consts.js'

client_scripts {
    'client/nuiCallbacks.js',
    'client/helpers/registCommand.js',
    'client/helpers/cameraHelper.js',
    'client/helpers/headshotHelper.js',
    'client/helpers/interactHelper.js',
    'client/functions/rooms.js',
    'client/functions/teams.js',
    'client/functions/game.js',
    'client/client.js',
}

server_scripts {
    'server/helpers/hideColors.js',
    'server/helpers/leaveRoom.js',
    'server/helpers/resetRoom.js',
    'server/helpers/shuffle.js',
    'server/server.js'
}

ui_page 'ui/index.html'

data_file 'DLC_ITYP_REQUEST' 'stream/codenames_board.ytyp'

files { 
    'consts.js',
    'assets/kartya/*.png',
    'ui/helper/countdown.js',
    'ui/helper/refreshPlayerList.js',
    'ui/helper/post.js',
    'ui/helper/uiHelper.js',
    'ui/helper/nextRoundBtn.js',
    'ui/helper/modifyWordCards.js',
    'ui/helper/modifyClueHistory.js',
    'ui/helper/ingamePlayerList.js',
    'ui/helper/clueInput.js',
    'ui/index.html',
    'ui/style.css',
    'ui/script.js'
}
