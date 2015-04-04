require_relative 'base'

module Docker
  module API
    class Containers < Docker::API::Base

      reroute :get, %w(
        /ps
        /json
        /:id/export
        /:id/changes
        /:id/json
        /:id/top
        /:id/stats
        /:id/attach/ws
      )

      get '/:id/logs' do
        stream do |out|
          @client.stream(request, params: params) do |data|
            out.write(data)
          end
        end
      end

      reroute :post, %w(
        /create
        /:id/kill
        /:id/attach
        /:id/pause
        /:id/unpause
        /:id/rename
        /:id/restart
        /:id/start
        /:id/stop
        /:id/wait
        /:id/resize
        /:id/copy
        /:id/exec
      )

      reroute :delete, %w( /:id )
    end
  end
end
