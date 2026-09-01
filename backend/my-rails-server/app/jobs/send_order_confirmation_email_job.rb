class SendOrderConfirmationEmailJob < ApplicationJob
    queue_as :default

    def perform(order_id)
        order = Order.find_by(id: order_id)
        return unless order

        OrderMailer.confirmation_email(order).deliver_now
    rescue StandardError => e
        Rails.logger.error("Failed to send order confirmation email for order ##{order_id}: #{e.message}")
    end
end
