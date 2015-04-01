require 'pry'
require 'socket'
require 'thread'

# Inherit from this class when wrapping Docker API calls.
class DockerController < ApplicationController
  def self.reroute(method, routes)
    routes.each do |route|
      send(method, route) do
        if hijack?
          hijack
        else
          redirect_to_docker(method)
        end
      end
    end
  end

  def hijack?
    env['HTTP_UPGRADE']    == 'tcp' &&
    env['HTTP_CONNECTION'] == 'Upgrade' &&
    env['rack.hijack?']
  end

  def hijack
    env['rack.hijack'].call
    io = env['rack.hijack_io']
    begin
      if params['stdin']
        while line = io.gets
          io.write("received #{line.chomp}\r\n")
        end
      else
        10.times do |i|
          io.write("#{i}\r\n")
        end
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