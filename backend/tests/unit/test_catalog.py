from app.core.catalog import catalog_by_key, load_catalog, slugify


def test_slugify_matches_existing_mutual_nda_key():
    assert slugify("Mutual-NDA") == "mutual_nda"


def test_slugify_handles_all_real_filenames():
    assert slugify("CSA") == "csa"
    assert slugify("DPA") == "dpa"
    assert slugify("design-partner-agreement") == "design_partner_agreement"
    assert slugify("Software-License-Agreement") == "software_license_agreement"
    assert slugify("AI-Addendum") == "ai_addendum"


def test_load_catalog_excludes_coverpage_fragment():
    keys = {entry.key for entry in load_catalog()}
    assert "mutual_nda_coverpage" not in keys
    assert "mutual_nda" in keys


def test_load_catalog_has_exactly_eleven_entries():
    assert len(load_catalog()) == 11


def test_catalog_by_key_matches_load_catalog():
    by_key = catalog_by_key()
    assert set(by_key.keys()) == {entry.key for entry in load_catalog()}
