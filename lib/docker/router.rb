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
        status @response.status
        body   @response.body
      end
    end

    module ClassMethods
      def reroute(method, routes)
        routes.each do |route|
          send(method, route) do
            @response = @client.send(request, params: params)
          end
        end
      end
    end
  end
end
