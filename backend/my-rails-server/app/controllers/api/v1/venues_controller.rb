module Api
    module V1
        class VenuesController < BaseController
            def index
                venues = Venue.all.order(:name)
                venues = venues.search(params[:search]) if params[:search].present?

                render json: {
                    venues: venues.map(&:as_json_payload),
                    total_count: venues.size
                }, status: :ok
            end

            def show
                venue = Venue.find_by(id: params[:id])

                if venue
                    render json: { venue: venue.as_json_payload }, status: :ok
                else
                    render json: { error: "Venue not found" }, status: :not_found
                end
            end
        end
    end
end
