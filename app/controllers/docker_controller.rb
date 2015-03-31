require 'pry'
require 'socket'

# Inherit from this class when wrapping Docker API calls.
class DockerController < ApplicationController
  def self.reroute(method, routes)
    routes.each do |route|
      send(method, route) do
        req = DockerRequest.new(request)

        #Test properly hijack request
        if req.hijack?
          env['rack.hijack'].call do |io|
            io.write('lol')
          end
        end

        response = req.send(method)

        status  response.code
        body    response.body

        response
      end
    end
  end
           #  # remote_ip: socket.remote_address.ip? &&
          #             socket.remote_address.ip_address,

     #   {

    #                 ,
    #      local_adress: socket.local_address.ip? &&
    #                    socket.local_address.ip_address,
    #      local_port: socket.local_address.ip? &&
    #                  socket.local_address.ip_port,
    #    }
end