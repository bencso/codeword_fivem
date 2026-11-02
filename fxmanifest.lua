fx_version 'cerulean'
game 'gta5'

author 'bencso'
description 'codeword'

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
    'server/functions/nextRound.js',
    'server/functions/skipRound.js',
    'server/functions/pickWord.js',
    'server/functions/resetRoom.js',
    'server/functions/endGame.js',
    'server/functions/startGame.js',
    'server/functions/pickSpymaster.js',
    'server/functions/addClue.js',
    'server/functions/hideColors.js',
    'server/functions/leaveRoom.js',
    'server/functions/shuffle.js',
    'server/functions/testBot.js',
    'server/functions/switchSpSelector.js',
    'server/server.js'
}

ui_page 'ui/index.html'


files { 
    'locale.js',
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
