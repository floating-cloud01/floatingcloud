jQuery.sap.declare("UI10.Component");
sap.ui.getCore().loadLibrary("sap.ui.generic.app");
jQuery.sap.require("sap.ui.generic.app.AppComponent");

sap.ui.generic.app.AppComponent.extend("UI10.Component", {
	metadata: {
		"manifest": "json"
	}
});