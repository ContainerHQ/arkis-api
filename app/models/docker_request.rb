require 'rest-client'

class DockerRequest < SimpleDelegator
  DOCKER_HOST = 'http://staging-runners.42grounds.io:2375'

  def get
    RestClient.get(url, { params: params })
  end

  def post
    RestClient.post(url, body.read, { 'Content-Type' => 'application/json' }) do |response|
      response
    end
  end

  # TODO: Use memoize
  def url
    "#{DOCKER_HOST}#{script_name}#{path_info}"
  end
end
