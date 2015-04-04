#\ -p 8081 -o 0.0.0.0 -s unicorn -E production

$LOAD_PATH.unshift File.expand_path('../lib', __FILE__)

require 'grape'
require 'docker'

# we can load everything *.rb in api/
require_relative 'api/docker'

map('/v1.17') { run Docker::API::Base }
