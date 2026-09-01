Rails.application.routes.draw do
    get "up" => "rails/health#show", as: :rails_health_check

    namespace :api do
        namespace :v1 do
            namespace :auth do
                post "signup", to: "registrations#create"
                post "login", to: "sessions#create"
                get "me", to: "sessions#me"
            end
        end
    end
end
