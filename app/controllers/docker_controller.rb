require 'pry'

# Inherit from this class when wrapping Docker API calls.
class DockerController < ApplicationController
  def self.reroute(method, routes)
    routes.each do |route|
      send(method, route) do
        binding.pry
        response = DockerRequest.new(request).send(method)

        status  response.code
        body    response.body
        headers \
          'Content-Type'   => response.headers[:content_type],
          'Content-Length' => response.headers[:content_length]
        response
      end
    end
  end

  def self.hijack(method, routes)
    routes.each do |route|
      send(method, route) do
     #   puts "sending request"

        binding.pry
  #      DockerRequest.new(request).send

    #    puts "Proxy hijacked"

   #     TCPSocket.open('staging-runners.42grounds.io', 2375)
      end
    end
  end
end
