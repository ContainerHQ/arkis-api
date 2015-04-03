require 'rest-client'
require 'socket'
require 'curb'
module Docker
  class Request < Struct.new(:client, :request, :params)
    # headers must add ssl certficates if client.tls_verify?
    # send block as method (something like .get(url, &avoid_exceptions)

    def send
      __send__(method)
    end

    def stream(socket)
      curl = Curl::Easy.new(url)

      curl.on_body   { |data| socket.write(data) }
      curl.on_header { |data| socket.write(data) }

      curl.multipart_form_post = true
      curl.http_post
    end

    # TODO: remove restclient


    def headers
      { content_type: :json, accept: :json }
    end

    def method
      request.request_method.downcase
    end

    def content
      @content ||= request.body.read
    end

    def url
      @url ||= "#{client.host}#{request.script_name}#{request.path_info}?#{request.query_string}"
    end

    private

    def get
      RestClient.get(url) { |response| response }
    end

    alias_method :delete, :get

    def post
      RestClient.post(url, content, headers) { |response| response }
    end
  end
end