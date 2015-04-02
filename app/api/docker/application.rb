require 'pry'
require 'socket'
require 'thread'
# HELPER

# Inherit from this class when wrapping Docker API calls.
module API
  module Docker
    class Application < API::Application
      def self.reroute(method, routes)
        routes.each do |route|
          send(method, route) do
            if hijack?
              hijack
            else
              redirect_to_docker
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
            # Should run in a thread
            # we don't need to close docker socket I think, only the server
            # (docker host) should close it.
            # thread.run do
            #    read docker socket
            #    write to client socket
            # end
            while line = io.gets
              # send to docker socket

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

      def redirect_to_docker
        # must be in a before filter
        @docker_client = DockerClient.get

        response = @docker_client.send_request(request, params)

        status  response.code
        body    response.body

        response
      end
    end
  end
end