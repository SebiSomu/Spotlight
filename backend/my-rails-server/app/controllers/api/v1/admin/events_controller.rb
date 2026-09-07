module Api
    module V1
        module Admin
            class EventsController < BaseController
                before_action :set_event, only: [:show, :update, :destroy]

                def index
                    events = Event.all.includes(:venue, :ticket_types, :tickets)
                    events = events.search(params[:search]) if params[:search].present?
                    events = events.by_status(params[:status]) if params[:status].present?
                    events = events.by_genre(params[:genre]) if params[:genre].present?
                    events = events.by_venue(params[:venue_id]) if params[:venue_id].present?

                    order_by = params[:sort_by] == "created_at" ? { created_at: :desc } : { starts_at: :asc }
                    events = events.order(order_by)

                    render json: {
                        events: events.map(&:as_admin_json_payload),
                        total_count: events.size
                    }, status: :ok
                end

                def show
                    render json: { event: @event.as_admin_json_payload }, status: :ok
                end

                def create
                    ActiveRecord::Base.transaction do
                        @event = Event.new(event_params)

                        # Process ticket types
                        ticket_types_data = params[:ticket_types] || []

                        if ticket_types_data.blank?
                            # Create a default general admission ticket type if none provided
                            ticket_types_data = [
                                {
                                    name: "General Admission",
                                    price_cents: params[:min_price_cents].to_i > 0 ? params[:min_price_cents].to_i : 4500,
                                    quantity_available: 100,
                                    quantity_remaining: 100
                                }
                            ]
                        end

                        min_cents = ticket_types_data.map { |tt| (tt[:price_cents] || (tt[:price].to_f * 100).round).to_i }.min
                        @event.min_price_cents = min_cents if min_cents && min_cents > 0

                        if @event.save
                            ticket_types_data.each do |tt_data|
                                price_cents = tt_data[:price_cents].present? ? tt_data[:price_cents].to_i : (tt_data[:price].to_f * 100).round
                                qty = tt_data[:quantity_available].to_i
                                qty_rem = tt_data[:quantity_remaining].present? ? tt_data[:quantity_remaining].to_i : qty

                                @event.ticket_types.create!(
                                    name: tt_data[:name].presence || "General Admission",
                                    price_cents: price_cents,
                                    quantity_available: qty,
                                    quantity_remaining: qty_rem
                                )
                            end

                            render json: { event: @event.reload.as_admin_json_payload }, status: :created
                        else
                            render json: { errors: @event.errors.full_messages }, status: :unprocessable_entity
                        end
                    end
                rescue ActiveRecord::RecordInvalid => e
                    render json: { error: e.message }, status: :unprocessable_entity
                end

                def update
                    ActiveRecord::Base.transaction do
                        if @event.update(event_params)
                            if params[:ticket_types].present? && params[:ticket_types].is_a?(Array)
                                existing_ids = params[:ticket_types].map { |t| t[:id] }.compact.map(&:to_i)
                                @event.ticket_types.where.not(id: existing_ids).destroy_all if existing_ids.any?

                                params[:ticket_types].each do |tt_data|
                                    price_cents = tt_data[:price_cents].present? ? tt_data[:price_cents].to_i : (tt_data[:price].to_f * 100).round
                                    qty = tt_data[:quantity_available].to_i
                                    qty_rem = tt_data[:quantity_remaining].present? ? tt_data[:quantity_remaining].to_i : qty

                                    if tt_data[:id].present?
                                        tt = @event.ticket_types.find_by(id: tt_data[:id])
                                        tt&.update!(
                                            name: tt_data[:name],
                                            price_cents: price_cents,
                                            quantity_available: qty,
                                            quantity_remaining: qty_rem
                                        )
                                    else
                                        @event.ticket_types.create!(
                                            name: tt_data[:name].presence || "General Admission",
                                            price_cents: price_cents,
                                            quantity_available: qty,
                                            quantity_remaining: qty_rem
                                        )
                                    end
                                end

                                min_cents = @event.ticket_types.minimum(:price_cents)
                                @event.update!(min_price_cents: min_cents) if min_cents
                            end

                            render json: { event: @event.reload.as_admin_json_payload }, status: :ok
                        else
                            render json: { errors: @event.errors.full_messages }, status: :unprocessable_entity
                        end
                    end
                rescue ActiveRecord::RecordInvalid => e
                    render json: { error: e.message }, status: :unprocessable_entity
                end

                def destroy
                    @event.destroy
                    render json: { message: "Event successfully deleted" }, status: :ok
                end

                private

                def set_event
                    @event = Event.find_by(id: params[:id])
                    render json: { error: "Event not found" }, status: :not_found unless @event
                end

                def event_params
                    params.require(:event).permit(
                        :title,
                        :artist,
                        :genre,
                        :description,
                        :starts_at,
                        :status,
                        :min_price_cents,
                        :image_url,
                        :venue_id
                    )
                end
            end
        end
    end
end
