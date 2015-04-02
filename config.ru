#\ -p 8080 -o 0.0.0.0 -s puma -E production

require 'grape'

Dir.glob('./app/{models,helpers,api}/*.rb').each { |file| require file }

map('/containers') { run API::Docker::Containers }
map('/images')     { run API::Docker::Images }
map('/exec')       { run API::Docker::Exec }
map('/')           { run API::Docker::Root }