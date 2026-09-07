Rails.application.routes.draw do
    get "up" => "rails/health#show", as: :rails_health_check

    namespace :api do
        namespace :v1 do
            namespace :auth do
                post "signup", to: "registrations#create"
                post "login", to: "sessions#create"
                get "me", to: "sessions#me"
            end

            resources :events, only: [:index, :show]
            resources :venues, only: [:index, :show]
            resources :holds, only: [:create, :show, :destroy]
            resources :orders, only: [:index, :show, :create]
            post "chat", to: "chat#create"
            post "chat/ingest", to: "chat#ingest"

            namespace :admin do
                get "stats", to: "stats#index"
                resources :events
                resources :venues
            end
        end
    end
end

