require 'pry'
require 'socket'
require 'thread'

# Inherit from this class when wrapping Docker API calls.
class DockerController < ApplicationController
  def self.reroute(method, routes)
    routes.each do |route|
      send(method, route) do
        if env['HTTP_UPGRADE'] == 'tcp' && env['HTTP_CONNECTION'].downcase == 'upgrade'
          hijack
        else
          redirect_to_docker(method)
        end
      end
    end
  end

  def hijack
    # TODO: verify if hijack is possible
    env['rack.hijack'].call
    io = env['rack.hijack_io']
    begin
      10.times do |i|
        io.write("#{i}\r\n")
      end
      # TODO:
      # If AttachStdin, read, write on docker host socket, read docker host socket and write this one.
      # Use another thread to read docker host socket.
      # Search on the internet if it's possible to read and write from TCPSocket at the same time
      # without race conditions.
    ensure
      io.close
    end
  end

  def redirect_to_docker(method)
    response = DockerRequest.new(request).send(method)

    status  response.code
    body    response.body

    response
  end
end