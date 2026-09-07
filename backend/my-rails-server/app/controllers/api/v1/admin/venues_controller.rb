module Api
    module V1
        module Admin
            class VenuesController < BaseController
                before_action :set_venue, only: [:show, :update, :destroy]

                def index
                    venues = Venue.all.includes(:events)
                    venues = venues.search(params[:search]) if params[:search].present?
                    venues = venues.order(:name)

                    render json: {
                        venues: venues.map(&:as_admin_json_payload),
                        total_count: venues.size
                    }, status: :ok
                end

                def show
                    render json: { venue: @venue.as_admin_json_payload }, status: :ok
                end

                def create
                    @venue = Venue.new(venue_params)

                    if @venue.save
                        render json: { venue: @venue.as_admin_json_payload }, status: :created
                    else
                        render json: { errors: @venue.errors.full_messages }, status: :unprocessable_entity
                    end
                end

                def update
                    if @venue.update(venue_params)
                        render json: { venue: @venue.as_admin_json_payload }, status: :ok
                    else
                        render json: { errors: @venue.errors.full_messages }, status: :unprocessable_entity
                    end
                end

                def destroy
                    if @venue.events.any?
                        # If venue has events, delete dependent events or disallow
                        @venue.destroy
                    else
                        @venue.destroy
                    end
                    render json: { message: "Venue successfully deleted" }, status: :ok
                end

                private

                def set_venue
                    @venue = Venue.find_by(id: params[:id])
                    render json: { error: "Venue not found" }, status: :not_found unless @venue
                end

                def venue_params
                    params.require(:venue).permit(
                        :name,
                        :address,
                        :city,
                        :state,
                        :capacity,
                        :image_url,
                        :latitude,
                        :longitude
                    )
                end
            end
        end
    end
end
