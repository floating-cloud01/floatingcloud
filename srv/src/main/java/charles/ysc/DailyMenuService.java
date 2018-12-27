package charles.ysc;

import java.util.HashMap;
import java.util.Map;

import com.sap.cloud.sdk.service.prov.api.DataSourceHandler;
import com.sap.cloud.sdk.service.prov.api.EntityData;
import com.sap.cloud.sdk.service.prov.api.ExtensionHelper;
import com.sap.cloud.sdk.service.prov.api.annotations.BeforeCreate;
import com.sap.cloud.sdk.service.prov.api.exception.DatasourceException;
import com.sap.cloud.sdk.service.prov.api.exits.BeforeCreateResponse;
import com.sap.cloud.sdk.service.prov.api.request.CreateRequest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class DailyMenuService {

	public static final Logger LOG = LoggerFactory.getLogger(DailyMenuService.class.getName());

	@BeforeCreate(entity = "DailyMenu", serviceName = "CatalogService")
	public BeforeCreateResponse beforeCreateDailyMenu(CreateRequest cr, ExtensionHelper eh) {

		String entityName = cr.getEntityMetadata().getName();
		Map<String, Object> body = cr.getMapData();
		Map<String, Object> keys = new HashMap<String, Object>();
		keys.put("ID", body.get("ID"));
		keys.put("Date", body.get("Date"));
		DataSourceHandler dh = eh.getHandler();
		try {
			EntityData ed = dh.executeRead(entityName, keys, cr.getEntityMetadata().getFlattenedElementNames());
			if (ed != null) {
				dh.executeDelete(entityName, keys);
			}
		} catch (DatasourceException e) {
			LOG.error("HANA DB Connection Error");
		} finally {
			return BeforeCreateResponse.setSuccess().response();
		}
	}
}
