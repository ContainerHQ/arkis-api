require 'active_support/concern'
require 'pry'

module Docker
  module Router
    extend ActiveSupport::Concern

    included do
      before do
        @client = Docker::Client.get
      end

      after do
        # FORMAT STATUS BODY HEADERS HERE
      end

      helpers do
        def hijack?
          env['HTTP_UPGRADE']    == 'tcp' &&
          env['HTTP_CONNECTION'] == 'Upgrade' &&
          env['rack.hijack?']
        end

        def hijack
          Thread.new do
            env['rack.hijack'].call
            io = env['rack.hijack_io']
            begin
              io.write("Status: 101\r\n")
              # it appears that the socket must be in the same thread to write
              @client.hijack(io, request, params: params)
            ensure
              io.close
            end
          end
        end
      end
    end

    ## REST CLIENT MULTIPART IS SHITTY
    ## IT'S SEEMS TO BE WAITING FOR EACH PART BEFORE LEAVING
    ## WE NEED A PROPER STREAM READER

    module ClassMethods
      def reroute(method, routes)
        routes.each do |route|
          send(method, route) do
            return hijack if hijack?

            response = @client.send_request(request, params: params)

            status response.code
            body   response.body

            # response.headers.each do |key, value|
            #   puts key.to_s.titleize.gsub(' ', '-')
            #   puts value
            #   header key.to_s.titleize.gsub(' ', '-'), value
            # end
            #header 'Content-Type', 'application/json'
            # TODO: copy header response
          end
        end
      end
    end
  end
end