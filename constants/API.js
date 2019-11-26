const BC_ROOT_URL = "https://api.businesscentral.dynamics.com";
const BC_API_VERSION = "v2.0";
const TENANT_ID = "<tenand_guid>";
const ENV = "DEV";
const PUBLISHER = "waldo";
const API_GROUP = "ntdapp";
const VERSION = "v1.0";

const DEFAULT_COMPANY = "<company_system_id>";

let currentCompany = DEFAULT_COMPANY;

const BASE_URL = `${BC_ROOT_URL}/${BC_API_VERSION}/${TENANT_ID}/${ENV}/api/${PUBLISHER}/${API_GROUP}/${VERSION}`;

export const API = {
    getAuthorization: token => ({ Authorization: `Bearer ${token}` }),
    setCompany: company => currentCompany = company,

    getCompaniesUrl: () => `${BASE_URL}/companies`,
    getItemsUrl: (perPage = 10, startAt = 1) => `${BASE_URL}/companies(${currentCompany})/legoItems?$filter=customVisionId%20ne%20''&$top=${perPage}&$skip=${startAt - 1}`,
    getItemPictureUrl: (id) => `${BASE_URL}/companies(${currentCompany})/legoItemPictures(${id})`,
    getItemPictureContentUrl: (id) => `${BASE_URL}/companies(${currentCompany})/legoItemPictures(${id})/imageContent`,
};

