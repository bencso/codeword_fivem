fx_version 'cerulean'
game 'gta5'

author 'bencso'
description 'Codenames'

shared_script 'consts.js'

client_scripts {
    'client/helpers/headshotHelper.js',
    'client/helpers/interactHelper.js',
    'client/client.js'
}

server_scripts {
    'server/helpers/shuffle.js',
    'server/server.js'
}

ui_page 'ui/index.html'

files { 
    'consts.js',
    'ui/helper/countdown.js',
    'ui/helper/playerlist.js',
    'ui/helper/post.js',
    'ui/helper/uiHelper.js',
    'ui/index.html',
    'ui/style.css',
    'ui/script.js'
}
