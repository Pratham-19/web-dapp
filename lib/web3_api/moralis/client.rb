module Web3Api
  module Moralis
    class Client
      BASE_URI = "https://deep-index.moralis.io/api/v2.2"
      NFTS_URI_PATH = "nft"

      def retrieve_contract_nfts(contract_address:, chain:)
        url = "#{BASE_URI}/#{NFTS_URI_PATH}/#{contract_address}/stats"

        params = {
          chain: chain
        }
        Faraday.get(url, params, headers)
      end

      def retrieve_wallet_nfts(wallet_address:, chain:, contract_addresses: [])
        url = "#{BASE_URI}/#{wallet_address}/#{NFTS_URI_PATH}"

        params = {
          chain: chain
        }

        params[:token_addresses] = contract_addresses if contract_addresses.any?

        Faraday.get(url, params, headers)
      end

      def retrieve_transactions(address:, start_timestamp:, chain:, end_timestamp: nil)
        url = "#{BASE_URI}/#{address}"

        params = {
          chain: chain,
          from_date: start_timestamp,
          disable_total: false
        }
        params[:to_date] = end_timestamp if end_timestamp.present?
        Faraday.get(url, params, headers)
      end

      private

      def headers
        {
          "Content-Type": "application/json; charset=utf-8",
          "x-api-key": ENV["MORALIS_API_KEY"]
        }
      end
    end
  end
end
