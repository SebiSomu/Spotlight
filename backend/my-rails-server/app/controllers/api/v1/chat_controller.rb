module Api
  module V1
    class ChatController < BaseController
      rescue_from StandardError, with: :handle_standard_error

      def create
        message = params[:message].to_s.strip
        if message.blank?
          return render json: { error: "Message is required" }, status: :unprocessable_entity
        end

        history = if params[:history].is_a?(Array)
          params[:history].map do |h|
            if h.respond_to?(:to_unsafe_h)
              h.to_unsafe_h.transform_keys(&:to_s)
            elsif h.respond_to?(:to_h)
              h.to_h.transform_keys(&:to_s)
            else
              { "role" => h.try(:[], "role") || h.try(:[], :role),
                "content" => h.try(:[], "content") || h.try(:[], :content) }
            end
          end
        else
          []
        end

        result = AiChatService.send_message(message: message, history: history)

        if result["error"]
          render json: { error: result["error"], reply: build_safe_fallback_reply(message), sources: [] }
        else
          render json: result
        end
      end

      def ingest
        result = AiChatService.trigger_ingestion
        if result["status"] == "ok"
          render json: result
        else
          render json: result, status: :service_unavailable
        end
      end

      private

      def build_safe_fallback_reply(message)
        "I'm Spotlight AI — your concert assistant. Right now the AI service is starting up or " \
        "temporarily unreachable, but I can still help! Try these questions:\n" \
        "  • What concerts are happening in Miami?\n" \
        "  • Tell me about Bad Bunny shows\n" \
        "  • What venues are there in California?\n\n" \
        "Your question was: \"#{message}\""
      end

      def handle_standard_error(err)
        Rails.logger.error("[ChatController] Caught exception: #{err.class} — #{err.message}")
        Rails.logger.error(err.backtrace.first(8).join("\n")) if err.backtrace
        render json: {
          error: "Chat service error: #{err.class}",
          debug: Rails.env.development? ? err.message : nil,
          reply: build_safe_fallback_reply(params[:message].to_s),
          sources: []
        }
      end
    end
  end
end
