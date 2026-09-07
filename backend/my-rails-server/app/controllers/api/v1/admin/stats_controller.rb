module Api
    module V1
        module Admin
            class StatsController < BaseController
                def index
                    total_events = Event.count
                    published_events = Event.where(status: "published").count
                    draft_events = Event.where(status: "draft").count
                    sold_out_events = Event.where(status: "sold_out").count
                    cancelled_events = Event.where(status: "cancelled").count

                    total_venues = Venue.count
                    total_orders = Order.count
                    total_tickets_sold = Ticket.where(status: "valid").count
                    total_revenue_cents = Order.where(status: "paid").sum(:total_cents)
                    total_revenue_dollars = (total_revenue_cents / 100.0).round(2)

                    recent_events = Event.order(created_at: :desc).limit(5).map(&:as_json_payload)

                    render json: {
                        stats: {
                            total_events: total_events,
                            published_events: published_events,
                            draft_events: draft_events,
                            sold_out_events: sold_out_events,
                            cancelled_events: cancelled_events,
                            total_venues: total_venues,
                            total_orders: total_orders,
                            total_tickets_sold: total_tickets_sold,
                            total_revenue_cents: total_revenue_cents,
                            total_revenue_dollars: total_revenue_dollars
                        },
                        recent_events: recent_events
                    }, status: :ok
                end
            end
        end
    end
end
