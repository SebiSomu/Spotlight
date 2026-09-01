module Api
    module V1
        class EventsController < BaseController
            def index
                events = Event.published.upcoming
                events = events.search(params[:search]) if params[:search].present?
                events = events.by_date(params[:date]) if params[:date].present?
                events = events.by_genre(params[:genre]) if params[:genre].present?

                render json: {
                    events: events.map(&:as_json_payload),
                    total_count: events.size
                }, status: :ok
            end

            def show
                event = Event.published.find_by(id: params[:id])

                if event
                    render json: { event: event.as_json_payload }, status: :ok
                else
                    render json: { error: "Event not found" }, status: :not_found
                end
            end
        end
    end
end
