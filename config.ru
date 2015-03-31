require 'sinatra/base'

require './app/helpers/application_helper'
require './app/controllers/application_controller'
require './app/controllers/docker_controller'

Dir.glob('./app/{models,helpers,controllers}/*.rb').each { |file| require file }

map('/v1.17/containers') { run ContainersController }
map('/v1.17/images')     { run ImagesController }
map('/v1.17/exec')       { run ExecController }
map('/v1.17/')           { run IndexController }