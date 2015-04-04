require 'socket'
require 'curb'

Docker::Response = Struct.new(:status, :body, :headers)

module Docker
  class Request < Struct.new(:client, :request, :params)
    # headers must add ssl certficates if client.tls_verify?
    # send block as method (something like .get(url, &avoid_exceptions)

    def send
      return hijack if hijack? || stream?

      __send__(method)
    end

    private

    def stream(io)
      http_client = curl
      http_client.on_body do |data|
        if data == 8
          io.write(data)
          io.write("\r\n")
        else
          io.write(data)
        end
      end
      http_client.on_header { |data| io.write(data) }

      http_client.multipart_form_post = true
      begin
        http_client.send(:"http_#{method}")
      rescue
      end
    end

    # THREAD.new bad idea
    def hijack
      request.env['rack.hijack'].call
      io = request.env['rack.hijack_io']
      Thread.new do
        begin
          stream(io)
        ensure
          io.close
        end
      end
      # use grape/sinatra response instead?
      Docker::Response.new(200, '', '')
    end

    def hijack?
      request.env['HTTP_UPGRADE']    == 'tcp' &&
      request.env['HTTP_CONNECTION'] == 'Upgrade' &&
      request.env['rack.hijack?']
    end

    def stream?
      params.include?('follow')
    end

    def headers
      {
        'Content-Type' => 'application/json',
        'Accept'       => 'application/json',
      }
    end

    def method
      request.request_method.downcase
    end

    def content
      @content ||= request.body.read
    end

    def url
      @url ||= "#{client.endpoint}#{request.script_name}#{request.path_info}?#{request.query_string}"
    end

    # TODO: Share Curl::Easy.new across request
    def get
      curl.tap(&:http_get)
    end

    def post
      curl.tap { |c| c.http_post(content) }
    end

    def delete
      curl.tap(&:http_delete)
    end

    def curl
      Curl::Easy.new(url) do |curl|
        curl.headers['Content-Type'] = 'application/json'

        curl.cacert   = File.join(client.cert_path, 'ca.pem')
        curl.cert     = File.join(client.cert_path, 'cert.pem')
        curl.cert_key = File.join(client.cert_path, 'key.pem')
        curl.ssl_verify_peer = client.tls_verify?
      end
    end
  end
end
