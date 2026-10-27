fx_version 'cerulean'
game 'gta5'

author 'bencso'
description 'Codenames'

shared_script 'consts.js'

client_scripts {
    'client/helpers/interactHelper.js',
    'client/helpers/uiHelpers.js',
    'client/client.js'
}

server_scripts {
    'server/server.js'
}

ui_page 'ui/index.html'

files {
    'ui/index.html',
    'ui/style.css',
    'ui/script.js'
}
