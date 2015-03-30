require 'rest-client'

class DockerRequest < SimpleDelegator
  HOST = 'http://staging-runners.42grounds.io:2375'

  def send
    RestClient.send(request_method.downcase,
      "#{HOST}#{script_name}#{path_info}?#{query_string}"
    )
  end
end