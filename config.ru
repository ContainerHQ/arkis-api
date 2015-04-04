#\ -p 8081 -o 0.0.0.0 -s puma -E production

$LOAD_PATH.unshift File.expand_path('../lib', __FILE__)

require 'sinatra/base'
require 'sinatra/streaming'

# we can load everything *.rb in api/
require_relative 'api/docker'

map('/v1.17') do
  map('/containers') { run Docker::API::Containers }
  map('/exec')       { run Docker::API::Exec }
  map('/images')     { run Docker::API::Images }
  map('/')           { run Docker::API::Root }
end
