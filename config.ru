require 'sinatra/base'

require './app/helpers/application_helper'
require './app/controllers/application_controller'

Dir.glob('./app/{models,helpers,controllers}/*.rb').each { |file| require file }

map('/containers') { run ContainersController }
map('/')           { run IndexController }