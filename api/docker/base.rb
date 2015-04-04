require 'docker'

module Docker
  module API
    class Base < Sinatra::Base
      helpers Sinatra::Streaming

      before do
        @client = Docker::Client.get
      end

      after do
        return if @res.nil?

        status @res.status
        body   @res.body
      end

      def self.reroute(method, routes)
        routes.each do |route|
          send(method, route) do
            @res = @client.send(request, params: params)
          end
        end
      end
    end
  end
end
